import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatFechaHoraEmailConsultorio } from '../common/consultorio-time';

export interface CitaConRelaciones {
  id: number;
  fechaHora: Date;
  duracionMinutos: number;
  motivo?: string | null;
  paciente: {
    nombre: string;
    apellido: string;
    email?: string | null;
    telefono?: string | null;
  };
  medico: {
    especialidad?: string | null;
    usuario: { nombre: string; apellido: string };
  };
}

interface CalendarioEmailData {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  inicio: Date;
  fin: Date;
  googleUrl: string;
  outlookUrl: string;
  icsContent: string;
}

@Injectable()
export class NotificacionesCitaService {
  private readonly logger = new Logger(NotificacionesCitaService.name);
  private readonly timeZone = 'America/Argentina/Buenos_Aires';

  constructor(private config: ConfigService) {}

  isGmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return /@(gmail\.com|googlemail\.com)$/.test(normalized);
  }

  tieneEmail(email: string | null | undefined): boolean {
    return !!email?.trim();
  }

  async enviarConfirmacion(cita: CitaConRelaciones): Promise<{
    emailEnviado: boolean;
    googleCalendarCreado: boolean;
    googleEventId?: string;
  }> {
    const email = cita.paciente.email?.trim();
    let emailEnviado = false;
    let googleCalendarCreado = false;
    let googleEventId: string | undefined;

    if (!email) {
      this.logger.log(`Cita ${cita.id}: sin email, sin notificaciones`);
      return { emailEnviado, googleCalendarCreado };
    }

    const medicoNombre = `Dr. ${cita.medico.usuario.nombre} ${cita.medico.usuario.apellido}`;
    const fecha = formatFechaHoraEmailConsultorio(new Date(cita.fechaHora));
    const calendario = this.buildCalendarioData(cita, medicoNombre);

    emailEnviado = await this.enviarEmail({
      to: email,
      subject: `Turno confirmado — Consultorios Colom · Oftalmología`,
      html: this.buildEmailHtml(cita, medicoNombre, fecha, calendario),
      text: this.buildEmailText(cita, medicoNombre, fecha, calendario),
      attachments: [
        {
          filename: 'turno-consultorio.ics',
          content: calendario.icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        },
      ],
    });

    if (this.isGmail(email)) {
      const result = await this.crearEventoGoogleCalendar(cita, email, medicoNombre);
      googleCalendarCreado = result.ok;
      googleEventId = result.eventId;
    }

    return { emailEnviado, googleCalendarCreado, googleEventId };
  }

  getEnlacesCalendario(cita: CitaConRelaciones) {
    const medicoNombre = `Dr. ${cita.medico.usuario.nombre} ${cita.medico.usuario.apellido}`;
    const cal = this.buildCalendarioData(cita, medicoNombre);
    return {
      googleUrl: cal.googleUrl,
      outlookUrl: cal.outlookUrl,
    };
  }

  private buildCalendarioData(
    cita: CitaConRelaciones,
    medicoNombre: string,
  ): CalendarioEmailData {
    const inicio = new Date(cita.fechaHora);
    const fin = new Date(inicio.getTime() + cita.duracionMinutos * 60 * 1000);
    const ubicacion =
      this.config.get('CONSULTORIO_DIRECCION') ||
      'Consultorios Médicos Dres. Colom';
    const titulo = `Consulta médica - ${cita.paciente.apellido}, ${cita.paciente.nombre}`;
    const descripcion = [
      medicoNombre,
      cita.medico.especialidad ? `Especialidad: ${cita.medico.especialidad}` : '',
      cita.motivo ? `Motivo: ${cita.motivo}` : '',
      'Consultorios Médicos Dres. Colom',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      titulo,
      descripcion,
      ubicacion,
      inicio,
      fin,
      googleUrl: this.buildGoogleCalendarUrl(titulo, descripcion, ubicacion, inicio, fin),
      outlookUrl: this.buildOutlookUrl(titulo, descripcion, ubicacion, inicio, fin),
      icsContent: this.buildIcs(cita.id, titulo, descripcion, ubicacion, inicio, fin),
    };
  }

  private toGoogleUtc(d: Date): string {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  private buildGoogleCalendarUrl(
    title: string,
    details: string,
    location: string,
    start: Date,
    end: Date,
  ): string {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${this.toGoogleUtc(start)}/${this.toGoogleUtc(end)}`,
      details,
      location,
      ctz: this.timeZone,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  private buildOutlookUrl(
    title: string,
    body: string,
    location: string,
    start: Date,
    end: Date,
  ): string {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: title,
      body,
      location,
      startdt: start.toISOString(),
      enddt: end.toISOString(),
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  private formatIcsDateLocal(d: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    return `${get('year')}${get('month')}${get('day')}T${get('hour')}${get('minute')}${get('second')}`;
  }

  private escapeIcs(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  private buildIcs(
    citaId: number,
    summary: string,
    description: string,
    location: string,
    start: Date,
    end: Date,
  ): string {
    const now = this.formatIcsDateLocal(new Date());
    const dtStart = this.formatIcsDateLocal(start);
    const dtEnd = this.formatIcsDateLocal(end);
    const uid = `cita-${citaId}@consultorios-colom`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Consultorios Colom//Agenda//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${this.timeZone}:${dtStart}`,
      `DTEND;TZID=${this.timeZone}:${dtEnd}`,
      `SUMMARY:${this.escapeIcs(summary)}`,
      `DESCRIPTION:${this.escapeIcs(description)}`,
      `LOCATION:${this.escapeIcs(location)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  private buildEmailHtml(
    cita: CitaConRelaciones,
    medicoNombre: string,
    fecha: string,
    cal: CalendarioEmailData,
  ): string {
    const logoUrl =
      this.config.get<string>('PUBLIC_SITE_URL')?.replace(/\/$/, '') ||
      'https://www.colomoftalmologia.com.ar';
    const logoSrc = `${logoUrl}/logo.png`;
    const especialidad = cita.medico.especialidad
      ? ` (${this.escapeHtml(cita.medico.especialidad)})`
      : '';
    const motivoRow = cita.motivo
      ? `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#5a6a7a;font-size:14px;width:140px;">Motivo</td>
            <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#051626;font-size:14px;font-weight:600;">${this.escapeHtml(cita.motivo)}</td>
          </tr>`
      : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ddd4c8;">
          <tr>
            <td style="background:#051626;padding:28px 32px;text-align:center;">
              <img src="${logoSrc}" alt="Consultorios Colom" width="72" height="72" style="display:block;margin:0 auto 14px;border-radius:8px;border:0;" />
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">Consultorios Colom</div>
              <div style="font-size:13px;font-weight:600;color:#d4af37;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">Oftalmología</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:#051626;">Turno confirmado</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#4a6078;">
                Hola <strong style="color:#051626;">${this.escapeHtml(cita.paciente.nombre)} ${this.escapeHtml(cita.paciente.apellido)}</strong>,
                su turno fue reservado correctamente.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6eb;border-radius:8px;padding:4px 16px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#5a6a7a;font-size:14px;width:140px;">Fecha y hora</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#051626;font-size:14px;font-weight:600;">${this.escapeHtml(fecha)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#5a6a7a;font-size:14px;">Médico</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#051626;font-size:14px;font-weight:600;">${this.escapeHtml(medicoNombre)}${especialidad}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#5a6a7a;font-size:14px;">Duración</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#051626;font-size:14px;font-weight:600;">${cita.duracionMinutos} minutos</td>
                </tr>
                ${motivoRow}
                <tr>
                  <td style="padding:10px 0;color:#5a6a7a;font-size:14px;">Lugar</td>
                  <td style="padding:10px 0;color:#051626;font-size:14px;font-weight:600;">${this.escapeHtml(cal.ubicacion)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#051626;">Agregar a su calendario</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:8px;padding-bottom:8px;">
                    <a href="${cal.googleUrl}" target="_blank" rel="noopener"
                      style="display:inline-block;background:#051626;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:6px;font-weight:bold;font-size:13px;">
                      Google Calendar
                    </a>
                  </td>
                  <td style="padding-bottom:8px;">
                    <a href="${cal.outlookUrl}" target="_blank" rel="noopener"
                      style="display:inline-block;background:#d4af37;color:#051626;text-decoration:none;padding:11px 18px;border-radius:6px;font-weight:bold;font-size:13px;">
                      Outlook
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.45;color:#6b7c8d;">
                También puede abrir el archivo adjunto <strong>turno-consultorio.ics</strong> (iPhone, Android, Apple Calendar).
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:13px;color:#4a6078;">Por favor llegue unos minutos antes del horario indicado.</p>
              <p style="margin:16px 0 0;padding-top:16px;border-top:1px solid #e8e4dc;font-size:12px;color:#8fa3b8;line-height:1.5;">
                <strong style="color:#051626;">Consultorios Colom — Oftalmología</strong><br />
                ${this.escapeHtml(cal.ubicacion)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private buildEmailText(
    cita: CitaConRelaciones,
    medicoNombre: string,
    fecha: string,
    cal: CalendarioEmailData,
  ): string {
    return [
      'Consultorios Colom — Oftalmología',
      'Confirmación de turno',
      '',
      `Hola ${cita.paciente.nombre} ${cita.paciente.apellido},`,
      'Su turno fue reservado correctamente.',
      '',
      `Fecha: ${fecha}`,
      `Médico: ${medicoNombre}${cita.medico.especialidad ? ` (${cita.medico.especialidad})` : ''}`,
      `Duración: ${cita.duracionMinutos} min`,
      cita.motivo ? `Motivo: ${cita.motivo}` : '',
      `Lugar: ${cal.ubicacion}`,
      '',
      'Agregar al calendario:',
      `Google: ${cal.googleUrl}`,
      `Outlook: ${cal.outlookUrl}`,
      '',
      'También adjuntamos el archivo turno-consultorio.ics',
      '',
      'Por favor llegue unos minutos antes del horario indicado.',
      'Consultorios Colom — Oftalmología',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async enviarEmail(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType?: string;
    }>;
  }): Promise<boolean> {
    const host = this.config.get('SMTP_HOST');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');
    const from = this.config.get('SMTP_FROM') || user;

    if (!host || !user || !pass) {
      this.logger.warn('SMTP no configurado; email no enviado');
      return false;
    }

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get('SMTP_PORT') || '587', 10),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        attachments: opts.attachments,
      });
      this.logger.log(`Email enviado a ${opts.to}`);
      return true;
    } catch (err) {
      this.logger.error('Error enviando email', err);
      return false;
    }
  }

  private async getGoogleAccessToken(): Promise<string | null> {
    const clientId = this.config.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    const refreshToken = this.config.get('GOOGLE_CALENDAR_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) return null;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      this.logger.error('Error obteniendo token Google', await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private async crearEventoGoogleCalendar(
    cita: CitaConRelaciones,
    attendeeEmail: string,
    medicoNombre: string,
  ): Promise<{ ok: boolean; eventId?: string }> {
    const calendarId = this.config.get('GOOGLE_CALENDAR_ID') || 'primary';
    const token = await this.getGoogleAccessToken();
    if (!token) {
      this.logger.warn('Google Calendar API no configurado (opcional; el mail ya incluye botones .ics)');
      return { ok: false };
    }

    const start = new Date(cita.fechaHora);
    const end = new Date(start.getTime() + cita.duracionMinutos * 60 * 1000);
    const ubicacion =
      this.config.get('CONSULTORIO_DIRECCION') ||
      'Consultorios Médicos Dres. Colom';

    const event = {
      summary: `Consulta - ${cita.paciente.apellido}, ${cita.paciente.nombre}`,
      description: `${medicoNombre}${cita.medico.especialidad ? ` - ${cita.medico.especialidad}` : ''}${cita.motivo ? `\nMotivo: ${cita.motivo}` : ''}`,
      location: ubicacion,
      start: { dateTime: start.toISOString(), timeZone: this.timeZone },
      end: { dateTime: end.toISOString(), timeZone: this.timeZone },
      attendees: [{ email: attendeeEmail }],
      reminders: { useDefault: true },
    };

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        },
      );

      if (!res.ok) {
        this.logger.error('Error creando evento Google', await res.text());
        return { ok: false };
      }

      const data = (await res.json()) as { id: string };
      this.logger.log(`Invitación Google Calendar API enviada: ${data.id}`);
      return { ok: true, eventId: data.id };
    } catch (err) {
      this.logger.error('Error Google Calendar', err);
      return { ok: false };
    }
  }

  async eliminarEventoGoogle(googleEventId: string): Promise<void> {
    const calendarId = this.config.get('GOOGLE_CALENDAR_ID') || 'primary';
    const token = await this.getGoogleAccessToken();
    if (!token || !googleEventId) return;

    try {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err) {
      this.logger.warn('No se pudo eliminar evento Google', err);
    }
  }
}
