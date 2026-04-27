import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const { name, email, phone, company, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0369a1; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
        Новая заявка с сайта Metric Solution
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; width: 140px;">Имя</td>
          <td style="padding: 10px 0; font-weight: 600;">${name}</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 10px 0; color: #64748b;">Email</td>
          <td style="padding: 10px 0;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b;">Телефон</td>
          <td style="padding: 10px 0;">${phone || '—'}</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 10px 0; color: #64748b;">Компания</td>
          <td style="padding: 10px 0;">${company || '—'}</td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding: 16px; background: #f0f9ff; border-left: 4px solid #0369a1; border-radius: 4px;">
        <p style="color: #64748b; margin: 0 0 8px;">Сообщение</p>
        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Metric Solution" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `Заявка от ${name}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка отправки. Попробуйте позже.' }, { status: 500 });
  }
}
