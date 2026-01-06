import {prisma} from './db'

// Function to get survey data by survey ID
export async function getLimeSurveyData(sid: string) {
  try {
    const tableName = `lime_survey_${sid}`;

    const surveyData: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM ${tableName}`
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
                q.question_theme_name,
                q.type,
                COALESCE(l10n.question, q.title) AS qtext
            FROM lime_questions q
            LEFT JOIN lime_question_l10ns l10n ON l10n.qid = q.qid
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
            GROUP BY qs.qid, qs.qtext, qs.question_theme_name, qs.type, qs.sid, qs.gid
        ),
        flat_cols AS (
            SELECT
                qid, qtext, question_theme_name, type,
                (e->>'colname') AS colname,
                (e->>'subcode') AS subcode
            FROM sgqa, LATERAL jsonb_array_elements(colmeta) AS e
        ),

        /* F: Map response cell value -> answer code -> localized text */
        arr_counts AS (
            SELECT
                fc.qtext,
                COALESCE(l10n_lang.answer, la.code) AS answer_value,
                COUNT(*) AS cnt
            FROM flat_cols fc
            JOIN ${tableName} r ON TRUE
            CROSS JOIN LATERAL row_to_json(r) AS rj(rowjson)
            CROSS JOIN LATERAL (
                VALUES (NULLIF(rj.rowjson ->> fc.colname, ''))
            ) AS v(val)
            JOIN lime_answers la
                ON la.qid = fc.qid
            AND la.code = v.val
            LEFT JOIN lime_answer_l10ns l10n_lang
                ON l10n_lang.aid = la.aid
            WHERE fc.type = 'F'
            AND v.val IS NOT NULL
            GROUP BY fc.qtext, COALESCE(l10n_lang.answer, la.code)
        ),
        arr_json AS (
            SELECT
                qtext,
                jsonb_agg(
                    jsonb_build_object('value', answer_value, 'count', cnt)
                    ORDER BY answer_value DESC NULLS LAST
                ) AS jarr
            FROM arr_counts
            GROUP BY qtext
        ),

        /* T/Q: collect raw answers, assign GLOBAL id, output array of objects */
        text_answers AS (
            SELECT
                t.qtext,
                COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', t.resp_id,
                            'value', t.ans
                        )
                        ORDER BY t.resp_id
                    ),
                    '[]'::jsonb
                ) AS jarr
            FROM (
                SELECT
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
            GROUP BY t.qtext
        ),

        merged AS (
            SELECT qtext, jarr FROM arr_json
            UNION ALL
            SELECT qtext, jarr FROM text_answers
        )
        SELECT jsonb_object_agg(qtext, jarr) AS result_json
        FROM merged;`
    );
    
    return columns;
  } catch (error: any) {
    console.error('Error fetching LimeSurvey columns:', error);
    throw new Error(`Failed to fetch columns for survey ${sid}: ${error.message}`);
  }
}