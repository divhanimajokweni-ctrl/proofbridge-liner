type Validator<T> = (value: string | undefined, key: string) => T;

function requiredString(min = 1): Validator<string> {
  return (value, key) => {
    if (!value || value.length < min) {
      throw new Error(`${key} must be at least ${min} characters`);
    }
    return value;
  };
}

function hexString(): Validator<string> {
  return (value, key) => {
    if (!value?.startsWith('0x')) {
      throw new Error(`${key} must be a 0x-prefixed hex string`);
    }
    return value;
  };
}

function urlString(): Validator<string> {
  return (value, key) => {
    if (!value) throw new Error(`${key} is required`);
    try {
      new URL(value);
      return value;
    } catch {
      throw new Error(`${key} must be a valid URL`);
    }
  };
}

const schema = {
  KERNEL_SECRET: requiredString(32),
  ORACLE_PRIVATE_KEY: hexString(),
  STITCH_WEBHOOK_SECRET: requiredString(16),
  CIRCUIT_BREAKER_ADDRESS: hexString(),
  RPC_URL: urlString(),
  DATABASE_URL: urlString(),
  REDIS_HOST: requiredString(1),
  REDIS_PORT: (value: string | undefined) => value || '6379',
};

export const EnvSchema = {
  parse(input: NodeJS.ProcessEnv) {
    return Object.fromEntries(
      Object.entries(schema).map(([key, validate]) => [key, validate(input[key], key)]),
    ) as Record<keyof typeof schema, string>;
  },
};

export const env = () => EnvSchema.parse(process.env);
