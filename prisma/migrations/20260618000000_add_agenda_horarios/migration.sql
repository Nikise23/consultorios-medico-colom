-- CreateTable
CREATE TABLE "horarios_medico" (
    "id" SERIAL NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "slotMinutos" INTEGER NOT NULL DEFAULT 20,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_medico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueos_agenda" (
    "id" SERIAL NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueos_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horarios_medico_medicoId_diaSemana_idx" ON "horarios_medico"("medicoId", "diaSemana");

-- CreateIndex
CREATE INDEX "bloqueos_agenda_medicoId_fecha_idx" ON "bloqueos_agenda"("medicoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "bloqueos_agenda_medicoId_fecha_key" ON "bloqueos_agenda"("medicoId", "fecha");

-- AddForeignKey
ALTER TABLE "horarios_medico" ADD CONSTRAINT "horarios_medico_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueos_agenda" ADD CONSTRAINT "bloqueos_agenda_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
