import { AxiosRequestHeaders } from 'axios';
import FormData from 'form-data';
import { injectable } from 'inversify';

@injectable()
class FormDataService implements FormDatable {
  private _formData: FormData;

  constructor() {
    this._formData = new FormData();
  }

  append(key: string, value: string) {
    this._formData.append(key, value);
  }

  getForm() {
    return this._formData as Omit<FormDatable, 'getForm' | 'start'>;
  }

  getHeaders() {
    return this._formData.getHeaders();
  }

  start() {
    this._formData = new FormData();

    return this;
  }
}

export default FormDataService;

export interface FormDatable {
  append: (key: string, value: any) => void;
  getHeaders: () => AxiosRequestHeaders;
  getForm: () => Omit<FormDatable, 'getForm' | 'start'>;
  start: () => FormDatable;
}
