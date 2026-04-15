import ActivityFeed from '@/components/ActivityFeed'

export default function ConstructoraActivityPage() {
  return (
    <ActivityFeed
      title="Actividad de la Constructora"
      description="Eventos recientes de deals, reservas, documentos y cambios de inventario."
      limit={100}
    />
  )
}
