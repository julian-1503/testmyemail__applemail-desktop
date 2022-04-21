import 'reflect-metadata';
import axios from 'axios';
import AxiosMock from 'axios-mock-adapter';
import { AxiosRequestHeaders } from 'axios';
import Chance from 'chance';
import ProvisionService from './provisioning';
import { FormDatable } from '@applemail/lib/src/form-data';

const chance = new Chance();
const axiosMock = new AxiosMock(axios);

describe('Provisioning', () => {
  let provisionService: ProvisionService;
  let formData: FormDataMock;
  let provisionURL: string;
  let emailAddress: string;
  let uploadUser: string;
  let uploadPassword: string;

  beforeEach(() => {
    formData = new FormDataMock();
    provisionURL = chance.url();
    emailAddress = chance.email();
    uploadUser = chance.string();
    uploadPassword = chance.string();

    provisionService = new ProvisionService(
      formData,
      provisionURL,
      emailAddress,
      uploadUser,
      uploadPassword
    );
  });

  describe('getProvisionSettings', () => {
    test('fetch provisioning settings from server', async () => {
      const provisionData = { ss_config: { image_folder: chance.string() } };

      axiosMock.onPost(provisionURL).reply(200, provisionData);

      const result = await provisionService.getProvisionSettings();

      expect(result).toEqual(provisionData);
    });
  });
});

class FormDataMock implements FormDatable {
  append(key: string, value: any) {
    return [key, value];
  }

  getHeaders() {
    return {} as AxiosRequestHeaders;
  }

  getForm() {
    return this;
  }

  start() {
    return this;
  }
}
