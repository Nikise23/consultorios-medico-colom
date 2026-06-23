-- Agenda interna opcional por médico (ej. Pablo / Francisco Colom)
ALTER TABLE "medicos" ADD COLUMN "usaAgenda" BOOLEAN NOT NULL DEFAULT false;
