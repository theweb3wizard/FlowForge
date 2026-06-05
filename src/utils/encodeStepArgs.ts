export function encodeStepArgValue(type: string, value: string): unknown {
  const normalizedType = type.trim();

  if (normalizedType === 'address') {
    return value as `0x${string}`;
  }

  if (normalizedType === 'bool') {
    return value === 'true';
  }

  if (normalizedType === 'string') {
    return value;
  }

  if (/^u?int(\d+)?$/.test(normalizedType)) {
    return BigInt(value || '0');
  }

  if (/^int(\d+)?$/.test(normalizedType)) {
    return BigInt(value || '0');
  }

  if (normalizedType.startsWith('bytes')) {
    return value as `0x${string}`;
  }

  return value;
}

export function encodeStepArgs(
  params: Array<{ type: string; value: string }>,
): unknown[] {
  return params.map((param) => encodeStepArgValue(param.type, param.value));
}
