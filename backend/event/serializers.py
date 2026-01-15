from rest_framework import serializers
from .models import Event, EventColor


class EventResponseSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(source="project.project_id", read_only=True)

    class Meta:
        model = Event
        fields = [
            "event_id",
            "project_id",
            "title",
            "is_all_day",
            "start_date",
            "end_date",
            "color",
        ]
        read_only_fields = ["event_id", "project_id"]


class EventCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    is_all_day = serializers.BooleanField(required=False, default=False)
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    color = serializers.ChoiceField(choices=[(c.value, c.label) for c in EventColor])

    default_error_messages = {
        "invalid_date_range": "end_date must be greater than or equal to start_date.",
        "blank_title": "title may not be blank.",
        "invalid_color": "invalid color value.",
    }

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if "title" in attrs:
            title = attrs["title"].strip()
            if not title:
                self.fail("blank_title")
            attrs["title"] = title

        if start_date and end_date and end_date < start_date:
            self.fail("invalid_date_range")

        if "color" in attrs:
            color = attrs["color"]
            if color not in [c.value for c in EventColor]:
                self.fail("invalid_color")

        return attrs

    def create(self, validated_data):
        project = self.context["project"]
        return Event.objects.create(project=project, **validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
