import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';
import { TwilioProvider } from '../providers/twilio.provider';
import { DialogFlowProvider } from '../providers/dialogFlow.provider';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VoiceBotsService {
  /**
   * @param configService
   * @param twilioProvider
   * @param dialogFlowProvider
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly twilioProvider: TwilioProvider,
    private readonly dialogFlowProvider: DialogFlowProvider,
  ) {}

  /**
   *
   */
  async initTwilio() {
    const client = this.twilioProvider.getClient();
    try {
      const res = await client.calls.create({
        url: this.configService.get('twilio_webhook'),
        to: '+923324176119', //this will be dynamic number retrieve from DB
        from: this.configService.get('twilio_phone'),
      });
      console.log(res);
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @param request
   */
  async captureResponse(request: Request): Promise<any> {
    const twiml = new twilio.twiml.VoiceResponse();
    try {
      const host = request.headers['x-original-host'] || request.hostname;
      console.log(host);

      const connect = twiml.connect();
      connect.stream({ url: 'wss://' + host + '/media' });
      console.log(twiml.toString());
      console.log(twiml);
      return twiml;
    } catch (error) {
      console.error(error);
      twiml.say('An error occurred. Please try again later.');
    }
  }

  /**
   * @param userInput
   * @private
   */
  private sendToDialogflow(userInput: string) {
    return new Promise((resolve, reject) => {
      this.dialogFlowProvider
        .getSessionClient()
        .detectIntent(this.dialogFlowProvider.getRequest(userInput))
        .then((responses: any) => {
          resolve(responses[0]);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
