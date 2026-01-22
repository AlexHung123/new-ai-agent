import { prisma } from './db';

// Function to get survey data by survey ID
export async function getLimeSurveyData(sid: string) {
  try {
    const tableName = `lime_survey_${sid}`;

    const surveyData: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM ${tableName}`,
    );

    return surveyData;
  } catch (error: any) {
    console.error('Error fetching LimeSurvey data:', error);
    throw new Error(`Failed to fetch data for survey ${sid}: ${error.message}`);
  }
}

// Function to get column information for a survey table
export async function getLimeSurveySummaryBySid(sid: string) {
  try {
    // const prismaClient = await getPrisma();

    const tableName = `lime_survey_${sid}`;

    // Get column information
    const columns: any[] = await prisma.$queryRawUnsafe(
      `WITH qs AS (
        SELECT
            q.qid,
            q.sid,
            q.gid,
            g.group_order,
            q.question_theme_name,
            q.type,
            q.question_order,
            COALESCE(l10n.question, q.title) AS qtext
        FROM lime_questions q
        JOIN lime_groups g
            ON g.gid = q.gid
        AND g.sid = q.sid
        LEFT JOIN lime_question_l10ns l10n
            ON l10n.qid = q.qid
        WHERE q.sid = ${sid}
            AND q.parent_qid = 0
            AND l10n.question NOT LIKE '%填表人資料%'
        ),
        sgqa AS (
        SELECT
            qs.qid,
            qs.qtext,
            qs.question_theme_name,
            qs.type,
            qs.group_order,
            qs.question_order,
            CASE
            WHEN qs.type = 'T' THEN
                jsonb_build_array(
                jsonb_build_object(
                    'colname', format('%sX%sX%s', qs.sid, qs.gid, qs.qid),
                    'subcode', NULL
                )
                )
            ELSE '[]'::jsonb
            END AS colmeta
        FROM qs
        LEFT JOIN lime_questions sub
            ON sub.parent_qid = qs.qid
        GROUP BY
            qs.qid, qs.qtext, qs.question_theme_name, qs.type,
            qs.sid, qs.gid, qs.group_order, qs.question_order
        ),
        flat_cols AS (
        SELECT
            qid, qtext, question_theme_name, type, group_order, question_order,
            (e->>'colname') AS colname,
            (e->>'subcode') AS subcode
        FROM sgqa, LATERAL jsonb_array_elements(colmeta) AS e
        ),

        arr_counts AS (
        SELECT
            fc.group_order,
            fc.question_order,
            fc.qtext,
            COALESCE(l10n_lang.answer, la.code) AS answer_value,
            COUNT(*) AS cnt
        FROM flat_cols fc
        JOIN ${tableName} r ON TRUE
        CROSS JOIN LATERAL row_to_json(r) AS rj(rowjson)
        CROSS JOIN LATERAL (VALUES (NULLIF(rj.rowjson ->> fc.colname, ''))) AS v(val)
        JOIN lime_answers la
            ON la.qid = fc.qid
        AND la.code = v.val
        LEFT JOIN lime_answer_l10ns l10n_lang
            ON l10n_lang.aid = la.aid
        WHERE fc.type = 'F'
            AND v.val IS NOT NULL
        GROUP BY
            fc.group_order, fc.question_order, fc.qtext,
            COALESCE(l10n_lang.answer, la.code)
        ),
        arr_json AS (
        SELECT
            group_order,
            question_order,
            qtext,
            jsonb_agg(
            jsonb_build_object('value', answer_value, 'count', cnt)
            ORDER BY answer_value DESC NULLS LAST
            ) AS jarr
        FROM arr_counts
        GROUP BY group_order, question_order, qtext
        ),

        text_answers AS (
        SELECT
            t.group_order,
            t.question_order,
            t.qtext,
            COALESCE(
            jsonb_agg(
                jsonb_build_object('id', t.resp_id, 'value', t.ans)
                ORDER BY t.resp_id
            ),
            '[]'::jsonb
            ) AS jarr
        FROM (
            SELECT
            fc.group_order,
            fc.question_order,
            fc.qid,
            fc.qtext,
            r.id AS resp_id,
            rj.rowjson ->> fc.colname AS ans
            FROM flat_cols fc
            JOIN ${tableName} r ON TRUE
            CROSS JOIN LATERAL row_to_json(r) AS rj(rowjson)
            WHERE fc.type IN ('T','Q')
            AND NULLIF(rj.rowjson ->> fc.colname, '') IS NOT NULL
        ) t
        GROUP BY t.group_order, t.question_order, t.qtext
        ),

        merged AS (
        SELECT group_order, question_order, qtext, jarr FROM arr_json
        UNION ALL
        SELECT group_order, question_order, qtext, jarr FROM text_answers
        )
        SELECT
        jsonb_agg(
            jsonb_build_object(qtext, jarr)
            ORDER BY group_order, question_order
        ) AS result_json
        FROM merged;`,
    );

    return columns;
  } catch (error: any) {
    console.error('Error fetching LimeSurvey columns:', error);
    throw new Error(
      `Failed to fetch columns for survey ${sid}: ${error.message}`,
    );
  }
}

export async function getLimeSurveySummaryIdsByUserId(username: string) {
  try {
    // Get column information
    const columns: any[] = await prisma.$queryRawUnsafe(
      `WITH u AS (
        SELECT uid
        FROM lime_users
        WHERE users_name = '${username}'
        ),
        is_superadmin AS (
        SELECT EXISTS (
            SELECT 1
            FROM lime_permissions p
            JOIN u ON u.uid = p.uid
            WHERE p.entity = 'global'    -- global permission
            AND p.entity_id = 0
            AND p.permission = 'superadmin'
            AND p.read_p = 1
        ) AS is_superadmin
        ),
        is_superadmin_surveys as(
        
        -- branch when user is superadmin: all surveys
        SELECT s.sid 
        FROM lime_surveys s
        CROSS JOIN is_superadmin
        WHERE is_superadmin.is_superadmin
        ),
        user_groups AS (
            SELECT DISTINCT ug.ugid 
            FROM lime_user_in_groups ug 
            inner join u on ug.uid = u.uid
        ),
        owned_surveys AS (
            SELECT sid, owner_id, active, datecreated, gsid
            FROM lime_surveys 
            inner join u on owner_id =  u.uid
        ),
        direct_permitted_surveys AS (
            SELECT DISTINCT s.sid
            FROM lime_surveys s 
            INNER JOIN lime_permissions p ON s.sid = p.entity_id 
            inner join u on  p.uid = u.uid
            WHERE p.entity = 'survey' 
            AND p.permission = 'survey' 
            AND p.read_p = 1
        ),
        group_permitted_surveys AS (
            SELECT DISTINCT s.sid
            FROM lime_surveys s 
            INNER JOIN lime_surveys_groups sg ON s.gsid = sg.gsid
            INNER JOIN lime_permissions p ON sg.gsid = p.entity_id 
            inner join u on  p.uid = u.uid
            where p.entity = 'surveysingroup' 
            AND p.permission = 'surveys' 
            AND p.read_p = 1
        )
        SELECT sid
        FROM owned_surveys 
        UNION 
        SELECT sid FROM direct_permitted_surveys
        UNION 
        SELECT sid FROM group_permitted_surveys
        union
        SELECT sid FROM is_superadmin_surveys`,
    );

    return columns;
  } catch (error: any) {
    console.error('Error fetching LimeSurvey columns:', error);
    throw new Error(
      `Failed to fetch columns for survey ${username}: ${error.message}`,
    );
  }
}
