/** Row type ánh xạ 1:1 bảng daily_attendance */
export interface AttendanceRow {
  id: string;
  tenant_id: string;
  school_id: string;
  attendance_date: string;
  classroom_id: string;
  class_name: string;
  total_registered: number;
  present_count: number;
  absent_count: number;
  excused_count: number;
  unexcused_count: number;
  note: string;
  recorded_by: string | null;
  updated_at: string;
}

export type AttendanceInsert = Omit<AttendanceRow, 'id' | 'updated_at'>;
export type AttendanceUpdate = Partial<Omit<AttendanceRow, 'id' | 'tenant_id' | 'school_id'>>;

/** Contract interface cho AttendanceRepository */
export interface IAttendanceRepository {
  /** Lấy điểm danh theo ngày */
  findByDate(date: string): Promise<AttendanceRow[]>;

  /** Tổng số trẻ có mặt của 1 ngày */
  getTotalPresentByDate(date: string): Promise<number>;

  /** Upsert toàn bộ điểm danh 1 ngày */
  saveDayAttendance(date: string, records: Omit<AttendanceInsert, 'tenant_id' | 'school_id'>[]): Promise<void>;
}
