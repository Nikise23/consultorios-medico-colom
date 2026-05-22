-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'NO_ASISTIO', 'CHECKIN', 'COMPLETADA');

-- CreateTable
CREATE TABLE "citas" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 20,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PROGRAMADA',
    "motivo" TEXT,
    "notas" TEXT,
    "atencionId" INTEGER,
    "googleEventId" TEXT,
    "emailEnviadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citas_atencionId_key" ON "citas"("atencionId");

-- CreateIndex
CREATE INDEX "citas_medicoId_fechaHora_idx" ON "citas"("medicoId", "fechaHora");

-- CreateIndex
CREATE INDEX "citas_pacienteId_idx" ON "citas"("pacienteId");

-- CreateIndex
CREATE INDEX "citas_estado_idx" ON "citas"("estado");

-- CreateIndex
CREATE INDEX "citas_fechaHora_idx" ON "citas"("fechaHora");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_atencionId_fkey" FOREIGN KEY ("atencionId") REFERENCES "atenciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
