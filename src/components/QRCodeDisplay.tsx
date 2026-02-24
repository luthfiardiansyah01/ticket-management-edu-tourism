'use client';

import { QRCodeSVG } from 'qrcode.react';

interface Props {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 128 }: Props) {
  return (
    <div className="bg-white p-2 rounded shadow-sm inline-block">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
