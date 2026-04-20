// Định nghĩa và kiểm tra các biến môi trường bắt buộc phải có
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Thiếu biến môi trường: ${key}. Vui lòng kiểm tra file .env`);
  }
  return value;
};

export const ENV = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  DATABASE_URL: getEnv('DATABASE_URL'),
  AUTH_SECRET: getEnv('AUTH_SECRET', 'default-secret-key-for-dev'),
  
  VNPAY: {
    TMN_CODE: getEnv('VNPAY_TMN_CODE', ''),
    HASH_SECRET: getEnv('VNPAY_HASH_SECRET', ''),
    URL: getEnv('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  },
  
  AI_SERVICE: {
    URL: getEnv('AI_SERVICE_URL', 'http://localhost:8000/v1/try-on'),
    API_KEY: getEnv('AI_API_KEY', ''),
  }
};