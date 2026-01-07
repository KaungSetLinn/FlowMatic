# files/serializers.py
from rest_framework import serializers
from .models import ProjectFile

class ProjectFileSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='file_id', read_only=True)
    uploader = serializers.ReadOnlyField(source='uploader.username')
    date = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()
    url = serializers.FileField(source='file', read_only=True)
    # Make sure name is not required (will default from filename)
    name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ProjectFile
        fields = ['id', 'name', 'uploader', 'date', 'size', 'url', 'file']
        extra_kwargs = {
            'file': {'write_only': True, 'required': True}
        }

    def get_date(self, obj):
        return obj.uploaded_at.strftime('%Y-%m-%d')

    def get_size(self, obj):
        try:
            size_bytes = obj.file.size
            if size_bytes < 1024:
                return f"{size_bytes}B"
            elif size_bytes < 1024 * 1024:
                return f"{size_bytes / 1024:.1f}KB"
            else:
                return f"{size_bytes / (1024 * 1024):.1f}MB"
        except:
            return "0KB"