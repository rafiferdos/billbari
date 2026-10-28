export interface CustomerInfo {
  name: string
  address: string
  electricityOffice: string
  feederName: string
  meterNumber: string
  customerNumber: string
  approvedLoadKw: number | string
  balance: number
  tariff: string
}

export interface RechargeRecord {
  id: string
  token: string
  powerKwh: number
  amountBdt: number // Gross recharge amount (e.g. 1000 BDT)
  netEnergyBdt?: number // Net electricity amount credited after deductions (e.g. 748.92 BDT)
  via: string
  date: string
  status: string
  // Extra vending details if present
  rent?: number
  demandCharge?: number
  pfcCharge?: number
  vat?: number
  arrears?: number
  subsidy?: number
}

export interface MonthlyConsumptionRecord {
  year: number | string
  month: string
  rechargeBdt: number
  discountBdt: number
  usageKwh: number
  energyBdt?: number
  meterRent?: number
  demandCharge?: number
  vat?: number
  totalBillBdt?: number
  monthEndBalance?: number
}

export type DataSource = "nesco_live" | "sample_demo"

export interface NescoFetchResult {
  success: boolean
  dataSource: DataSource
  customerInfo: CustomerInfo
  rechargeHistory: RechargeRecord[]
  monthlyUsage: MonthlyConsumptionRecord[]
  statusMessage?: string
  error?: string
  fetchedAt: string
}
