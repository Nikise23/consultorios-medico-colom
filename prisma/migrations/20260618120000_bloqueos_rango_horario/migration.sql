-- AlterTable: bloqueos parciales por rango horario
ALTER TABLE "bloqueos_agenda" ADD COLUMN "horaInicio" TEXT;
ALTER TABLE "bloqueos_agenda" ADD COLUMN "horaFin" TEXT;

-- DropIndex: permitir varios bloqueos el mismo día
DROP INDEX IF EXISTS "bloqueos_agenda_medicoId_fecha_key";
