from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['event_id', 'title', 'is_all_day', 'start_date', 'end_date', 'color']
        read_only_fields = ['event_id']

    def validate(self, data):
        """
        終了日時が開始日時より後であることを検証
        """
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError(
                    "end_date must be greater than or equal to start_date"
                )
        return data
