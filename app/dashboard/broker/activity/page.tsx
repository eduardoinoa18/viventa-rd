import ActivityFeed from '@/components/ActivityFeed'

export default function BrokerActivityPage() {
  return (
    <ActivityFeed
      title="Actividad del Office"
      description="Eventos operativos del office: deals, documentos, transacciones y comisiones."
      limit={200}
    />
  )
}
