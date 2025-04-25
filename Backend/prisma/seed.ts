import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Estados
  const statusNuevo = await prisma.status.upsert({
    where: { name: 'Nuevo' },
    update: {},
    create: { name: 'Nuevo' },
  });
  const statusInProgress = await prisma.status.upsert({
    where: { name: 'En Progreso' },
    update: {},
    create: { name: 'En Progreso' },
  });
  const statusClosed = await prisma.status.upsert({
    where: { name: 'Cerrado' },
    update: {},
    create: { name: 'Cerrado' },
  });

  // Prioridades
  const priorityLow = await prisma.priority.upsert({
    where: { name: 'Baja' },
    update: {},
    create: { name: 'Baja' },
  });
  const priorityMedium = await prisma.priority.upsert({
    where: { name: 'Media' },
    update: {},
    create: { name: 'Media' },
  });
  const priorityHigh = await prisma.priority.upsert({
    where: { name: 'Alta' },
    update: {},
    create: { name: 'Alta' },
  });

  // Categorías
  await prisma.category.upsert({
    where: { name: 'Técnico' },
    update: {},
    create: { name: 'Técnico' },
  });
  await prisma.category.upsert({
    where: { name: 'Facturación' },
    update: {},
    create: { name: 'Facturación' },
  });

  // Tipos de Ticket
  await prisma.ticketType.upsert({
    where: { name: 'Incidente' },
    update: {},
    create: {
      name: 'Incidente',
      description: 'Problema que afecta el funcionamiento normal del sistema.',
      defaultStatusId: statusNuevo.id,
      defaultPriorityId: priorityHigh.id,
    },
  });
  await prisma.ticketType.upsert({
    where: { name: 'Pregunta' },
    update: {},
    create: {
      name: 'Pregunta',
      description: 'Consulta o solicitud de información.',
      defaultStatusId: statusNuevo.id,
      defaultPriorityId: priorityLow.id,
    },
  });
  await prisma.ticketType.upsert({
    where: { name: 'Tarea' },
    update: {},
    create: {
      name: 'Tarea',
      description: 'Solicitud de trabajo o mejora.',
      defaultStatusId: statusNuevo.id,
      defaultPriorityId: priorityMedium.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });