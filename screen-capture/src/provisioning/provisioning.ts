import axios from 'axios';
import { inject, injectable } from 'inversify';
import { TYPES } from '@applemail/config/src/inversify.types';
import { ProvisionData } from './types';
import { FormDatable } from '@applemail/lib/src/form-data';

@injectable()
class Provisioning {
  private formDataManager: FormDatable;
  private readonly provisionURL: string;
  private readonly emailAddress: string;
  private readonly uploadUser: string;
  private readonly uploadPassword: string;

  constructor(
    @inject(TYPES.FormDataManager) formDataManager: FormDatable,
    @inject(TYPES.ProvisionURL) provisionURL: string,
    @inject(TYPES.EmailAddress) emailAddress: string,
    @inject(TYPES.UploadUser) uploadUser: string,
    @inject(TYPES.UploadPassword) uploadPassword: string
  ) {
    this.formDataManager = formDataManager;
    this.provisionURL = provisionURL;
    this.emailAddress = emailAddress;
    this.uploadUser = uploadUser;
    this.uploadPassword = uploadPassword;
  }

  async getProvisionSettings(): Promise<ProvisionData> {
    this.formDataManager.start();
    this.formDataManager.append('email_address', this.emailAddress);
    this.formDataManager.append('eoa_usr', this.uploadUser);
    this.formDataManager.append('eoa_pwd', this.uploadPassword);

    const response = await axios.post(
      this.provisionURL,
      this.formDataManager.getForm(),
      {
        headers: { ...this.formDataManager.getHeaders() },
      }
    );

    return response.data;
  }
}

export default Provisioning;
