from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
	class Meta:
		model = Event
		fields = ['event_id', 'title', 'is_all_day', 'start_date', 'end_date', 'color']
		read_only_fields = ['event_id']

	def validate(self, data):
		"""
		終了日時が開始日時以降であることを検証
		"""
		start_date = data.get('start_date')
		end_date = data.get('end_date')
		
		if start_date and end_date:
			if end_date < start_date:
				raise serializers.ValidationError({
					'end_date': 'end_date must be greater than or equal to start_date'
				})
		return data
