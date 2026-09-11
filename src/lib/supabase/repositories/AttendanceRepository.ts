import { BaseRepository } from '../base-repository';
import {
  IAttendanceRepository,
  AttendanceRow,
  AttendanceInsert,
} from '../interfaces/IAttendanceRepository';

/**
 * AttendanceRepository — Quản lý điểm danh hàng ngày.
 */
export class AttendanceRepository
  extends BaseRepository<AttendanceRow, AttendanceInsert, Partial<AttendanceInsert>>
  implements IAttendanceRepository
{
  private readonly schoolId: string;
  private readonly tenantId: string;

  constructor(tenantId: string, schoolId: string) {
    super('daily_attendance');
    this.tenantId = tenantId;
    this.schoolId = schoolId;
  }

  /**
   * Lấy tất cả điểm danh của 1 ngày (theo school_id).
   */
  async findByDate(date: string): Promise<AttendanceRow[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('attendance_date', date)
      .eq('school_id', this.schoolId)
      .order('classroom_id');

    if (error) {
      throw new Error(`[AttendanceRepository] findByDate error: ${error.message}`);
    }
    return (data ?? []) as AttendanceRow[];
  }

  /**
   * Tổng số trẻ có mặt thực tế của 1 ngày (dùng để điền sĩ số tự động).
   */
  async getTotalPresentByDate(date: string): Promise<number> {
    const records = await this.findByDate(date);
    return records.reduce((sum, r) => sum + r.present_count, 0);
  }

  /**
   * Upsert toàn bộ điểm danh 1 ngày (conflict: tenant+school+date+classroom).
   */
  async saveDayAttendance(
    date: string,
    records: Omit<AttendanceInsert, 'tenant_id' | 'school_id'>[]
  ): Promise<void> {
    if (records.length === 0) return;
    const client = await this.getClient();

    const rows: AttendanceInsert[] = records.map((r) => ({
      ...r,
      tenant_id: this.tenantId,
      school_id: this.schoolId,
      attendance_date: date,
    }));

    const { error } = await client
      .from(this.tableName)
      .upsert(rows, {
        onConflict: 'tenant_id,school_id,attendance_date,classroom_id',
      });

    if (error) {
      throw new Error(`[AttendanceRepository] saveDayAttendance error: ${error.message}`);
    }
  }
}
