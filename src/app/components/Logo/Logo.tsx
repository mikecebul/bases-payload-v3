import Image from 'next/image'
import React from 'react'

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Image alt="BASES Logo" className={className} height={252} src="/BasesLogo.png" width={1024} />
  )
}
