import { z } from 'zod'

export const coaSchema = z.object({
  txtHeadCode: z.string().min(1, 'Head Code is required'),
  txtHeadName: z.string().min(1, 'Head Name is required'),
  txtPHead: z.string().nullable().optional(),
  txtPHeadCode: z.string().nullable().optional(),
  txtHeadLevel: z.coerce.number(),
  txtHeadType: z.string(),
  IsActive: z.coerce.number().nullable().optional(),
  isFixedAssetSch: z.coerce.number().nullable().optional(),
  isStock: z.coerce.number().nullable().optional(),
  isCashNature: z.coerce.number().nullable().optional(),
  isBankNature: z.coerce.number().nullable().optional(),
  isSubType: z.coerce.number().nullable().optional(),
  subtype: z.string().nullable().optional(),
  assetCode: z.string().nullable().optional(),
  depCode: z.string().nullable().optional(),
  DepreciationRate: z.coerce.number().nullable().optional(),
  noteNo: z.string().nullable().optional(),
})

export type CoaFormData = z.infer<typeof coaSchema>
