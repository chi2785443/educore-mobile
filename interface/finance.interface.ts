export interface SalaryComponent {
  id?: string;
  name: string;
  type: 'basic_salary' | 'allowance' | 'deduction' | 'bonus' | 'overtime' | 'commission';
  amount: number;
  isPercentage?: boolean;
  percentage?: number;
  description?: string;
  isActive?: boolean;
}

export interface SalaryStructure {
  id: string;
  schoolId: string;
  employeeId: string;
  schoolMemberId?: string;
  jobTitle: string;
  department?: string;
  baseSalary: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  components: SalaryComponent[];
  employee?: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  classroomId: string;
  schoolId: string;
  academicYear: string;
  term: string;
  tuitionFee: number;
  examFee: number;
  libraryFee: number;
  transportFee: number;
  otherFees: number;
  fineAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  isPaid: boolean;
  classroom?: { name: string; grade?: string; section?: string };
  createdAt?: string;
}
