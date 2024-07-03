import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'src/prisma.service';
import * as crypto from 'crypto';
import {
  frontEndUrl,
  groupCampainEmailService,
  tokenCampainEmailService,
} from 'config/constants';
@Injectable()
export class EmailService {
  constructor(
    private readonly mailService: MailerService,
    private prisma: PrismaService,
  ) {}
  async sendEmail({
    email,
    from,
    subject,
    template,
    context,
  }: {
    email: string;
    from?: string;
    subject: string;
    template: string;
    context?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.mailService.sendMail({
        to: email,
        from,
        subject,
        template,
        context,
      });
    } catch (error) {
      throw new Error('Error sending email');
    }
  }
  async sendEmailVerification(email: string) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const tempToken = await this.prisma.temporal_token_pool.create({
        data: {
          token,
          userEmail: email,
          type: 'email_verification',
        },
      });
      if (!tempToken) {
        throw new Error('Error creating token');
      } else {
        await this.sendEmail({
          email,
          subject: 'verifique su correo electronico',
          template: 'user-sign_up',
          context: {
            link: `${frontEndUrl}/verificar-email?token=${token}`,
          },
        });
      }
    } catch (error) {
      throw new Error('Error sending email');
    }
  }

  async subscribeToNewsLetter(email: string) {
    try {
      const response = await fetch(
        `https://api.hubapi.com/contacts/v1/contact/email/${email}/profile`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenCampainEmailService}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const vid = data.vid;
        const subscribeInfo = data.properties.subscribed_to.value;
        let formatedSubscribeInfo = null;
        if (subscribeInfo.includes(';')) {
          formatedSubscribeInfo = subscribeInfo.split(';');
        } else {
          formatedSubscribeInfo = [subscribeInfo];
        }
        if (!formatedSubscribeInfo.includes(groupCampainEmailService)) {
          formatedSubscribeInfo.push(groupCampainEmailService);
          const response2 = await fetch(
            `https://api.hubapi.com/contacts/v1/contact/vid/${vid}/profile`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenCampainEmailService}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                properties: [
                  {
                    property: 'subscribed_to',
                    value: formatedSubscribeInfo.join(';'),
                  },
                ],
              }),
            },
          );
          if (response2.ok) {
            return {
              message: 'Subscribed successfully',
            };
          }
        }
        return {
          message: 'Already subscribed',
        };
      } else {
        const response3 = await fetch(
          'https://api.hubapi.com/crm/v3/objects/contacts',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenCampainEmailService}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: {
                email,
                subscribed_to: groupCampainEmailService,
              },
            }),
          },
        );
        if (response3.ok) {
          return {
            message: 'Subscribed successfully',
          };
        }
      }
    } catch (error) {
      return new Response(JSON.stringify({ message: 'Unknow Error' }), {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
  }
}
