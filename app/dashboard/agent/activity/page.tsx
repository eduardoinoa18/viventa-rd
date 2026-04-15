import ActivityFeed from '@/components/ActivityFeed'

export default function AgentActivityPage() {
  return (
    <ActivityFeed
      title="Mi Actividad"
      description="Eventos recientes de leads, tareas, seguimiento comercial y movimientos del office relevantes para tu operacion."
      limit={120}
    />
  )
}
