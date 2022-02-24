import FormData from "form-data";
import axios from "axios";

export const getProvisionSettings = async () => {
  const formData = new FormData();

  formData.append("email_address", process.env.EMAIL_ADDRESS);
  formData.append("eoa_usr", process.env.UPLOAD_USER);
  formData.append("eoa_pwd", process.env.UPLOAD_PASSWORD);

  const response = await axios.post(process.env.PROVISION_URL, formData, {
    headers: { ...formData.getHeaders() },
  });

  return response.data;
};
