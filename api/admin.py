from django.contrib import admin

# Register your models here.
"""
Admin configuration for the Knowledge Base API.
Registers KnowledgeItem so it can be managed via Django Admin.
"""

from django.contrib import admin
from .models import KnowledgeItem


@admin.register(KnowledgeItem)
class KnowledgeItemAdmin(admin.ModelAdmin):
    list_display  = ('id', 'ai_tag', 'short_content', 'created_at')
    list_filter   = ('ai_tag',)
    search_fields = ('content',)
    readonly_fields = ('ai_tag', 'created_at')

    def short_content(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content

    short_content.short_description = 'Content Preview'