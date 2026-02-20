"""
URL patterns for the Knowledge Base API.
"""

from django.urls import path
from .views import SnippetListView, SnippetDetailView

urlpatterns = [
    path('snippets/',      SnippetListView.as_view(),   name='snippet-list'),
    path('snippets/<int:pk>/', SnippetDetailView.as_view(), name='snippet-detail'),
]