import { Users } from 'lucide-react'
import { calcularResumenDia } from '../utils/citaAgenda'

export default function ResumenDiaAgenda({ citasDia, medicoNombre }) {
  const { total, porObraSocial } = calcularResumenDia(citasDia)

  if (total === 0) return null

  return (
    <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
        <Users className="w-3.5 h-3.5 text-primary-600" />
        {medicoNombre ? (
          <span>
            {total} paciente{total === 1 ? '' : 's'} previsto{total === 1 ? '' : 's'}{' '}
            <span className="font-normal text-slate-600">({medicoNombre})</span>
          </span>
        ) : (
          <span>
            {total} paciente{total === 1 ? '' : 's'} previsto{total === 1 ? '' : 's'}
          </span>
        )}
      </div>
      {porObraSocial.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-slate-600">
          {porObraSocial.map(([obra, cant]) => (
            <span key={obra} className="inline-flex items-center">
              <span className="font-medium text-slate-700">{obra}:</span>&nbsp;{cant}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
