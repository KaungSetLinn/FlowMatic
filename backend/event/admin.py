from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'start_date', 'end_date', 'is_all_day', 'color']
    list_filter = ['is_all_day', 'color', 'project']
    search_fields = ['title', 'project__name']
    readonly_fields = ['event_id']

