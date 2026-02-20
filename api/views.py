"""
Views for the Knowledge Base API.

Endpoints:
    POST   /api/snippets/         - Upload a new snippet (auto-tagged by AI)
    GET    /api/snippets/         - Retrieve all snippets (optional ?tag= and ?search= filters)
    GET    /api/snippets/<id>/    - Retrieve a single snippet by ID
    PUT    /api/snippets/<id>/    - Edit a snippet content (re-tagged by AI)
    DELETE /api/snippets/<id>/    - Delete a snippet
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import KnowledgeItem
from .serializers import KnowledgeItemSerializer, KnowledgeItemCreateSerializer
from .ai_tagger import get_tag


class SnippetListView(APIView):
    """
    GET  /api/snippets/   - List all snippets. Supports ?tag= and ?search= query params.
    POST /api/snippets/   - Create a new snippet. AI tag is assigned automatically.
    """

    def get(self, request):
        queryset = KnowledgeItem.objects.all()

        # ── Tag filtering ─────────────────────────────────────────────────────
        tag = request.query_params.get('tag', None)
        if tag:
            valid_tags = [choice[0] for choice in KnowledgeItem.Tag.choices]
            if tag not in valid_tags:
                return Response(
                    {'error': f"Invalid tag '{tag}'. Valid options are: {', '.join(valid_tags)}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(ai_tag=tag)

        # ── Smart search ──────────────────────────────────────────────────────
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(content__icontains=search)

        serializer = KnowledgeItemSerializer(queryset, many=True)
        return Response(
            {'count': queryset.count(), 'results': serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        input_serializer = KnowledgeItemCreateSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(
                {'errors': input_serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = input_serializer.validated_data['content']
        ai_tag  = get_tag(content)
        item    = KnowledgeItem.objects.create(content=content, ai_tag=ai_tag)

        return Response(
            {
                'message': 'Snippet uploaded and tagged successfully.',
                'data':    KnowledgeItemSerializer(item).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SnippetDetailView(APIView):
    """
    GET    /api/snippets/<id>/ - Retrieve single snippet
    PUT    /api/snippets/<id>/ - Edit snippet (AI re-tags automatically)
    DELETE /api/snippets/<id>/ - Delete snippet
    """

    def _get_object(self, pk):
        """Helper to fetch item or return None."""
        try:
            return KnowledgeItem.objects.get(pk=pk)
        except KnowledgeItem.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self._get_object(pk)
        if not item:
            return Response(
                {'error': f"No snippet found with id {pk}."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(KnowledgeItemSerializer(item).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """Edit snippet content — AI automatically re-tags the updated content."""
        item = self._get_object(pk)
        if not item:
            return Response(
                {'error': f"No snippet found with id {pk}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        input_serializer = KnowledgeItemCreateSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(
                {'errors': input_serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update content and re-run AI tagger
        item.content = input_serializer.validated_data['content']
        item.ai_tag  = get_tag(item.content)
        item.save()

        return Response(
            {
                'message': 'Snippet updated and re-tagged successfully.',
                'data':    KnowledgeItemSerializer(item).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        """Delete a snippet permanently."""
        item = self._get_object(pk)
        if not item:
            return Response(
                {'error': f"No snippet found with id {pk}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        item.delete()
        return Response(
            {'message': f"Snippet #{pk} deleted successfully."},
            status=status.HTTP_200_OK,
        )