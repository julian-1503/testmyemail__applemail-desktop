import axios from 'axios';
import FormData from 'form-data';

const notifyEmailProcessed = async ({
  logURL,
  zone,
  memberId,
  blockedImages,
  recordId,
  testTime,
  testDate,
  guid,
  test_guid,
  image_folder,
}: {
  logURL: string;
  zone: string;
  memberId: string;
  blockedImages: string;
  recordId: number;
  testTime: string;
  testDate: string;
  guid: string;
  test_guid: string;
  image_folder: string;
}) => {
  const formData = new FormData();
  formData.append('block_images', blockedImages);
  formData.append('imap', '');
  formData.append('rppapi', '');
  formData.append('client', image_folder);
  formData.append('zone', zone);
  formData.append('test_date', `${testDate} ${testTime}`);
  formData.append('member_id', memberId);
  formData.append('useGuid', 'true');
  formData.append('ss_record', recordId);
  formData.append('old_guid', guid);
  formData.append('guid', test_guid);

  await axios.post(logURL, formData, {
    headers: { ...formData.getHeaders() },
  });
};

const markEmailAsProcessedByServer = async ({
  zone,
  reserveURL,
  clientId,
  recordId,
}: {
  zone: string;
  reserveURL: string;
  clientId: string;
  recordId: number;
}) => {
  return await axios.post(reserveURL, {
    zone,
    ss_id: clientId,
    record_id_array: [recordId],
  });
};

export default {
  notifyEmailProcessed,
  markEmailAsProcessedByServer,
};
