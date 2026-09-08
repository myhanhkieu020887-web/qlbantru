export type UserRole = 'bgh' | 'ke_toan' | 'bep_truong' | 'giao_vien';

export interface RolePermission {
  role: UserRole;
  title: string;
  badgeColor: string;
  canEditNutrients: boolean;
  canEditPrice: boolean;
  canRunSolver: boolean;
  canApproveMenu: boolean;
  canLockMenu: boolean;
  canEditAttendance: boolean;
  canExportExcel: boolean;
  canFoodSafetyAudit: boolean;
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  bgh: {
    role: 'bgh',
    title: 'Ban Giám Hiệu',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    canEditNutrients: true,
    canEditPrice: false,
    canRunSolver: true,
    canApproveMenu: true,
    canLockMenu: true,
    canEditAttendance: true,
    canExportExcel: true,
    canFoodSafetyAudit: true,
    description: 'Toàn quyền phê duyệt thực đơn, khóa sổ và giám sát an toàn thực phẩm.',
  },
  ke_toan: {
    role: 'ke_toan',
    title: 'Kế Toán Bán Trú',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    canEditNutrients: true,
    canEditPrice: true,
    canRunSolver: true,
    canApproveMenu: false,
    canLockMenu: false,
    canEditAttendance: true,
    canExportExcel: true,
    canFoodSafetyAudit: false,
    description: 'Chỉnh sửa đơn giá, định lượng, chạy cân đối MILP và xuất sổ 01-MN.',
  },
  bep_truong: {
    role: 'bep_truong',
    title: 'Bếp Trưởng Tiếp Phẩm',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    canEditNutrients: false,
    canEditPrice: false,
    canRunSolver: false,
    canApproveMenu: false,
    canLockMenu: false,
    canEditAttendance: false,
    canExportExcel: true,
    canFoodSafetyAudit: true,
    description: 'Xem khối lượng thực phẩm cần mua, in phiếu giao nhận và kiểm thực 3 bước.',
  },
  giao_vien: {
    role: 'giao_vien',
    title: 'Giáo Viên Chủ Nhiệm',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    canEditNutrients: false,
    canEditPrice: false,
    canRunSolver: false,
    canApproveMenu: false,
    canLockMenu: false,
    canEditAttendance: true,
    canExportExcel: false,
    canFoodSafetyAudit: false,
    description: 'Điểm danh báo ăn lớp học đầu giờ và xem thực đơn hôm nay của trẻ.',
  },
};
