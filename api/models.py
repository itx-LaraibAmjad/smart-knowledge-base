from django.db import models

class KnowledgeItem(models.Model):
    """
    Represents a single knowledge snippet uploaded by the user.
    The ai_tag field is automatically assigned by the AI tagging engine.
    """

    class Tag(models.TextChoices):
        TECHNICAL = 'Technical', 'Technical'
        URGENT    = 'Urgent',    'Urgent'
        GENERAL   = 'General',   'General'

    content    = models.TextField(help_text="The uploaded text snippet.")
    ai_tag     = models.CharField(
        max_length=20,
        choices=Tag.choices,
        default=Tag.GENERAL,
        help_text="Tag automatically assigned by the AI engine.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']    # Newest first
        verbose_name = 'Knowledge Item'
        verbose_name_plural = 'Knowledge Items'

    def __str__(self):
        preview = self.content[:60] + '...' if len(self.content) > 60 else self.content
        return f"[{self.ai_tag}] {preview}"