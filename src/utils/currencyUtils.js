// Format mata uang Rupiah (IDR) tanpa desimal
const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatRupiah(value) {
  const number = Number(value) || 0
  return rupiahFormatter.format(number).replace(/\s/g, ' ')
}

export function formatRupiahShort(value) {
  const number = Number(value) || 0
  if (number >= 1000000) {
    return `Rp${(number / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  }
  return formatRupiah(number)
}
