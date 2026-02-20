"""
Serializers for the Knowledge Base API.
Handles validation and conversion between Python objects and JSON.
"""

from rest_framework import serializers
from django.conf import settings

from .models import KnowledgeItem


class KnowledgeItemSerializer(serializers.ModelSerializer):
    """Serializer for reading KnowledgeItem objects (GET requests)."""

    class Meta:
        model  = KnowledgeItem
        fields = ['id', 'content', 'ai_tag', 'created_at']
        read_only_fields = ['id', 'ai_tag', 'created_at']


class KnowledgeItemCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a new KnowledgeItem (POST requests).
    Validates the content field before passing to the view.
    """

    content = serializers.CharField(
        min_length=1,
        max_length=getattr(settings, 'MAX_SNIPPET_LENGTH', 400),
        error_messages={
            'blank':     'Content cannot be empty.',
            'min_length': 'Content must be at least 1 character long.',
            'max_length': f'Content cannot exceed {getattr(settings, "MAX_SNIPPET_LENGTH", 5000)} characters.',
        }
    )

    def validate_content(self, value):
        """Strip leading/trailing whitespace and reject whitespace-only strings."""
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("Content cannot be blank or whitespace only.")
        return stripped