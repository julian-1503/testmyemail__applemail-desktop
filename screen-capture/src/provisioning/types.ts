export interface ProvisionData {
  ss_config: {
    checkin_url: string;
    redis_server: { database: number; port: number; host: string };
    image_folder: string;
    thumb_height: string;
    thumb_width: string;
    aws_eoa_bucket: string;
    aws_access_key: string;
    aws_secret_key: string;
    reserve_url: string;
    screenshot_log_url: string;
    image_format: string;
    os_email_client_version_id: string;
  };
}

export interface ProvisionFetching {
  getProvisionSettings: () => Promise<ProvisionData>;
}
