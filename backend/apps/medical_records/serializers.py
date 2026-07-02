from rest_framework import serializers

from .models import Allergy, MedicalRecord, Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = (
            "id",
            "medical_record",
            "medication",
            "dosage",
            "frequency",
            "duration",
            "instructions",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
        extra_kwargs = {"medical_record": {"required": False}}


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    doctor_name = serializers.CharField(
        source="doctor.full_name", read_only=True, default=None
    )
    prescriptions = PrescriptionSerializer(many=True, required=False)

    class Meta:
        model = MedicalRecord
        fields = (
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "appointment",
            "record_date",
            "visit_type",
            "symptoms",
            "diagnosis",
            "treatment",
            "notes",
            "prescriptions",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        prescriptions = validated_data.pop("prescriptions", [])
        record = MedicalRecord.objects.create(**validated_data)
        for item in prescriptions:
            item.pop("medical_record", None)
            Prescription.objects.create(medical_record=record, **item)
        return record

    def update(self, instance, validated_data):
        prescriptions = validated_data.pop("prescriptions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if prescriptions is not None:
            instance.prescriptions.all().delete()
            for item in prescriptions:
                item.pop("medical_record", None)
                Prescription.objects.create(medical_record=instance, **item)
        return instance


class AllergySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = Allergy
        fields = (
            "id",
            "patient",
            "patient_name",
            "allergen",
            "reaction",
            "severity",
            "notes",
            "recorded_by",
            "recorded_at",
        )
        read_only_fields = ("id",)
