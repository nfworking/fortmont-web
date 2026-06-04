export type DnsRecord = {
  name: string;
  type: string;
  ttl: number;
  disabled: boolean;
  rData?: {
    ipAddress?: string;
  };
};

export type DnsApiResponse = {
  response?: {
    zone?: {
      name: string;
    };
    records?: DnsRecord[];
  };
  server?: string;
  status?: string;
};

export type CreateDnsRecordForm = {
  zone: string;
  domain: string;
  type: string;
  ttl: string;
  ipAddress: string;
};