# SUM(CASE WHEN acts.is_final_score = true THEN acts.id ELSE 0 END) AS act_id
class Scorebook::Query
  SCORES_PER_PAGE = 200

  def self.run(classroom_id, current_page=1, unit_id=nil, begin_date=nil, end_date=nil, offset=0)
    first_unit = self.units(unit_id) ? self.units(unit_id).first : nil
    last_unit = self.units(unit_id) ? self.units(unit_id).last : nil
    ActiveRecord::Base.connection.execute(
    "SELECT
       students.id AS user_id,
        cu.id AS cu_id,
        cuas.completed AS marked_complete,
        students.name AS name,
        activity.activity_classification_id,
        activity.name AS activity_name,
        activity.id AS activity_id,
        activity.description AS activity_description,
        MAX(acts.updated_at) AS updated_at,
        MIN(acts.started_at) AS started_at,
        MAX(acts.percentage) AS percentage,
        SUM(CASE WHEN acts.percentage IS NOT NULL THEN 1 ELSE 0 END) AS completed_attempts,
        SUM(CASE WHEN acts.state = 'started' THEN 1 ELSE 0 END) AS started,
        SUM(CASE WHEN acts.is_final_score = true THEN acts.id ELSE 0 END) AS id
     FROM classroom_units AS cu
     LEFT JOIN students_classrooms AS sc on cu.classroom_id = sc.classroom_id
     RIGHT JOIN users AS students ON students.id = sc.student_id
     #{first_unit}
     LEFT JOIN unit_activities ON unit_activities.unit_id = cu.unit_id
     INNER JOIN activities AS activity ON activity.id = unit_activities.activity_id
     LEFT JOIN activity_sessions AS acts ON (
           acts.classroom_unit_id = cu.id
           AND acts.user_id = students.id
           AND acts.activity_id = activity.id
           AND acts.visible
           )
     LEFT JOIN classroom_unit_activity_states AS cuas ON cuas.unit_activity_id = unit_activities.id AND cuas.classroom_unit_id = cu.id
     WHERE cu.classroom_id = #{classroom_id}
     AND  students.id = ANY (cu.assigned_student_ids::int[])
     AND unit_activities.visible
     AND cu.visible
     AND sc.visible
     #{last_unit}
     #{self.date_conditional_string(begin_date, end_date, offset)}
     GROUP BY
      students.id,
       students.name, cu.id, activity.activity_classification_id, activity.name, activity.description, cuas.completed, activity.id
     ORDER BY split_part( students.name, ' ' , 2),
       CASE WHEN SUM(CASE WHEN acts.percentage IS NOT NULL THEN 1 ELSE 0 END) > 0 THEN true ELSE false END DESC,
       MIN(acts.completed_at),
       CASE WHEN SUM(CASE WHEN acts.state = 'started' THEN 1 ELSE 0 END) > 0 THEN true ELSE false END DESC,
       cu.created_at ASC
       OFFSET (#{(current_page.to_i - 1) * SCORES_PER_PAGE})
       FETCH NEXT #{SCORES_PER_PAGE} ROWS ONLY"
    ).to_a
  end

  def self.units(unit_id)
    if unit_id && !unit_id.blank?
      ["INNER JOIN units ON cu.unit_id = units.id", "AND units.id = #{ActiveRecord::Base.sanitize(unit_id)}"]
    end
  end

  def self.sanitize_date(date)
    return ActiveRecord::Base.sanitize(date) if date && !date.blank?
  end

  def self.date_conditional_string(begin_date, end_date, offset)
    new_end_date = end_date ? (Date.parse(end_date) + 1.days).to_s : end_date
    sanitized_begin_date = self.sanitize_date(begin_date)
    sanitized_end_date = self.sanitize_date(new_end_date)
    return unless sanitized_begin_date || sanitized_end_date
    "AND (
      CASE
      WHEN acts.completed_at IS NOT NULL THEN
        #{self.date_substring_for_acts_completed_at(sanitized_begin_date, sanitized_end_date, offset)}
      WHEN acts.started_at IS NOT NULL THEN
        #{self.date_substring_for_acts_started_at(sanitized_begin_date, sanitized_end_date, offset)}
      ELSE
        #{self.date_substring_for_ca_created_at(sanitized_begin_date, sanitized_end_date, offset)}
      END
    )"
  end

  def self.to_offset_datetime (date, offset)
    (Date.parse(date).midnight - offset.seconds).to_s(:db)
  end

  def self.date_substring_for_acts_completed_at(begin_date, end_date, offset)
    [
      begin_date ? "acts.completed_at >= '#{self.to_offset_datetime(begin_date, offset)}'" : nil,
      end_date ? "acts.completed_at <= '#{self.to_offset_datetime(end_date, offset)}'" : nil
    ].reject(&:nil?).join(' AND ')
  end

  def self.date_substring_for_acts_started_at(begin_date, end_date, offset)
    [
      begin_date ? "acts.started_at >= '#{self.to_offset_datetime(begin_date, offset)}'" : nil,
      end_date ? "acts.started_at <= '#{self.to_offset_datetime(end_date, offset)}'" : nil
    ].reject(&:nil?).join(' AND ')

  end

  def self.date_substring_for_ca_created_at(begin_date, end_date, offset)
    [
      begin_date ? "cu.created_at >= '#{self.to_offset_datetime(begin_date, offset)}'" : nil,
      end_date ? "cu.created_at <= '#{self.to_offset_datetime(end_date, offset)}'" : nil
    ].reject(&:nil?).join(' AND ')
  end

end
