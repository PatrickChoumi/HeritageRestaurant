import { describe, expect, it } from 'vitest';
import {
  clientReservationEmail,
  reservationWhatsAppText,
  restaurantContactEmail,
  restaurantReservationEmail,
  type ReservationEmailData,
} from '@/lib/email/templates';

const reservation: ReservationEmailData & { id: number } = {
  id: 7,
  reference: 'HER-ABC234',
  date: '2026-10-17',
  time: '20:00',
  guests: 4,
  firstName: 'Aïcha',
  lastName: '<b>Mbarga</b>',
  email: 'aicha@example.com',
  phone: '+237659855617',
  occasion: 'birthday',
  requests: '<script>alert("x")</script>\nTable calme',
  locale: 'fr',
  service: 'dinner',
};

describe('e-mails de réservation', () => {
  it('échappe toute saisie du client', () => {
    for (const email of [clientReservationEmail('received', reservation), restaurantReservationEmail(reservation)]) {
      expect(email.html).not.toContain('<script>');
      expect(email.html).not.toContain('<b>Mbarga</b>');
      expect(email.html).toContain('&lt;script&gt;');
    }
  });

  it('n’utilise jamais de texte libre du client dans le sujet', () => {
    const subject = clientReservationEmail('received', reservation).subject;
    expect(subject).toBe('Votre demande de réservation chez Héritage — samedi 17 octobre');
    expect(restaurantReservationEmail(reservation).subject).toBe(
      'Nouvelle réservation HER-ABC234 — samedi 17 octobre 20h00 — 4 couverts',
    );
  });

  it('s’adresse au client dans sa langue', () => {
    const english = clientReservationEmail('confirmed', { ...reservation, locale: 'en' });
    expect(english.subject).toBe('Booking confirmed at Héritage — Saturday 17 October');
    expect(english.html).toContain('lang="en"');
    expect(english.text).toContain('Hello Aïcha,');
    expect(english.text).toContain('Occasion: Birthday');
  });

  it('propose un lien WhatsApp pré-rempli avec la référence', () => {
    const html = clientReservationEmail('received', reservation).html;
    expect(html).toContain('https://wa.me/237659855617?text=');
    expect(reservationWhatsAppText('fr', reservation)).toContain('Référence : HER-ABC234');
    expect(reservationWhatsAppText('en', { ...reservation, locale: 'en' })).toContain('4 guests');
  });

  it('donne à l’équipe un lien direct vers la fiche et vers le WhatsApp du client', () => {
    const html = restaurantReservationEmail(reservation).html;
    expect(html).toContain('/admin/reservations?id=7');
    expect(html).toContain('https://wa.me/237659855617?text=Bonjour%20A%C3%AFcha');
  });
});

describe('e-mail de contact', () => {
  it('échappe le message et garde les retours à la ligne', () => {
    const email = restaurantContactEmail({
      id: 1,
      name: 'Paul',
      email: 'paul@example.com',
      subject: 'group',
      message: 'Bonjour <img src=x onerror=alert(1)>\nNous serons 25.',
      locale: 'fr',
    });
    expect(email.subject).toBe('Nouveau message (Groupe ou privatisation) — site Héritage');
    expect(email.html).not.toContain('<img');
    expect(email.html).toContain('&lt;img src=x onerror=alert(1)&gt;<br>Nous serons 25.');
  });
});
