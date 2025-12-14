package org.example.campusmarket;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 数据库迁移验证测试
 * 验证 userinfo 表中的 school 和 student_id 字段是否已成功添加
 * 
 * 注意：此测试针对 MySQL 数据库，需要连接真实数据库运行
 * 在 H2 测试环境中跳过（INFORMATION_SCHEMA 结构不同）
 * 需求: 1.1, 1.2
 */
@SpringBootTest
@Disabled("此测试需要连接真实 MySQL 数据库，在 H2 测试环境中跳过")
public class DatabaseMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 测试 school 字段是否存在
     */
    @Test
    public void testSchoolColumnExists() {
        String sql = "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT " +
                     "FROM INFORMATION_SCHEMA.COLUMNS " +
                     "WHERE TABLE_SCHEMA = 'Campus_market' " +
                     "AND TABLE_NAME = 'userinfo' " +
                     "AND COLUMN_NAME = 'school'";
        
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
        
        assertFalse(result.isEmpty(), "school 字段应该存在于 userinfo 表中");
        
        Map<String, Object> column = result.get(0);
        assertEquals("school", column.get("COLUMN_NAME"), "字段名应该是 school");
        assertEquals("varchar(100)", column.get("COLUMN_TYPE"), "字段类型应该是 varchar(100)");
        assertEquals("YES", column.get("IS_NULLABLE"), "字段应该允许为 NULL");
        assertEquals("学校名称", column.get("COLUMN_COMMENT"), "字段注释应该是 '学校名称'");
        
        System.out.println("✓ school 字段验证通过");
    }

    /**
     * 测试 student_id 字段是否存在
     */
    @Test
    public void testStudentIdColumnExists() {
        String sql = "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT " +
                     "FROM INFORMATION_SCHEMA.COLUMNS " +
                     "WHERE TABLE_SCHEMA = 'Campus_market' " +
                     "AND TABLE_NAME = 'userinfo' " +
                     "AND COLUMN_NAME = 'student_id'";
        
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
        
        assertFalse(result.isEmpty(), "student_id 字段应该存在于 userinfo 表中");
        
        Map<String, Object> column = result.get(0);
        assertEquals("student_id", column.get("COLUMN_NAME"), "字段名应该是 student_id");
        assertEquals("varchar(50)", column.get("COLUMN_TYPE"), "字段类型应该是 varchar(50)");
        assertEquals("YES", column.get("IS_NULLABLE"), "字段应该允许为 NULL");
        assertEquals("学号", column.get("COLUMN_COMMENT"), "字段注释应该是 '学号'");
        
        System.out.println("✓ student_id 字段验证通过");
    }

    /**
     * 测试 idx_school 索引是否存在
     */
    @Test
    public void testSchoolIndexExists() {
        String sql = "SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, INDEX_TYPE " +
                     "FROM INFORMATION_SCHEMA.STATISTICS " +
                     "WHERE TABLE_SCHEMA = 'Campus_market' " +
                     "AND TABLE_NAME = 'userinfo' " +
                     "AND INDEX_NAME = 'idx_school'";
        
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
        
        assertFalse(result.isEmpty(), "idx_school 索引应该存在于 userinfo 表中");
        
        Map<String, Object> index = result.get(0);
        assertEquals("idx_school", index.get("INDEX_NAME"), "索引名应该是 idx_school");
        assertEquals("school", index.get("COLUMN_NAME"), "索引列应该是 school");
        
        System.out.println("✓ idx_school 索引验证通过");
    }

    /**
     * 测试能否查询包含新字段的数据
     */
    @Test
    public void testQueryWithNewFields() {
        String sql = "SELECT user_id, nickname, school, student_id FROM userinfo LIMIT 1";
        
        try {
            jdbcTemplate.queryForList(sql);
            System.out.println("✓ 包含新字段的查询执行成功");
        } catch (Exception e) {
            fail("查询包含新字段的 SQL 应该成功执行，但抛出异常: " + e.getMessage());
        }
    }

    /**
     * 测试能否插入包含新字段的数据
     */
    @Test
    public void testInsertWithNewFields() {
        // 首先插入一个测试用户到 users 表
        String insertUserSql = "INSERT INTO users (username, email, password, role) " +
                               "VALUES (?, ?, ?, ?)";
        String testUsername = "test_migration_" + System.currentTimeMillis();
        String testEmail = testUsername + "@test.com";
        
        try {
            jdbcTemplate.update(insertUserSql, testUsername, testEmail, "test_password", "user");
            
            // 获取插入的用户ID
            Integer userId = jdbcTemplate.queryForObject(
                "SELECT user_id FROM users WHERE username = ?", 
                Integer.class, 
                testUsername
            );
            
            assertNotNull(userId, "应该能够获取插入的用户ID");
            
            // 更新 userinfo 表，包含新字段
            String updateUserInfoSql = "UPDATE userinfo SET school = ?, student_id = ? WHERE user_id = ?";
            int rowsAffected = jdbcTemplate.update(updateUserInfoSql, "测试大学", "2024001", userId);
            
            assertEquals(1, rowsAffected, "应该更新一行数据");
            
            // 验证数据已正确插入
            String verifySql = "SELECT school, student_id FROM userinfo WHERE user_id = ?";
            Map<String, Object> result = jdbcTemplate.queryForMap(verifySql, userId);
            
            assertEquals("测试大学", result.get("school"), "school 字段应该正确保存");
            assertEquals("2024001", result.get("student_id"), "student_id 字段应该正确保存");
            
            System.out.println("✓ 包含新字段的插入和更新操作成功");
            
            // 清理测试数据
            jdbcTemplate.update("DELETE FROM users WHERE user_id = ?", userId);
            
        } catch (Exception e) {
            fail("插入和更新包含新字段的数据应该成功，但抛出异常: " + e.getMessage());
        }
    }

    /**
     * 测试新字段可以为 NULL
     */
    @Test
    public void testNewFieldsCanBeNull() {
        // 首先插入一个测试用户到 users 表
        String insertUserSql = "INSERT INTO users (username, email, password, role) " +
                               "VALUES (?, ?, ?, ?)";
        String testUsername = "test_null_" + System.currentTimeMillis();
        String testEmail = testUsername + "@test.com";
        
        try {
            jdbcTemplate.update(insertUserSql, testUsername, testEmail, "test_password", "user");
            
            // 获取插入的用户ID
            Integer userId = jdbcTemplate.queryForObject(
                "SELECT user_id FROM users WHERE username = ?", 
                Integer.class, 
                testUsername
            );
            
            assertNotNull(userId, "应该能够获取插入的用户ID");
            
            // 查询 userinfo，新字段应该为 NULL
            String verifySql = "SELECT school, student_id FROM userinfo WHERE user_id = ?";
            Map<String, Object> result = jdbcTemplate.queryForMap(verifySql, userId);
            
            assertNull(result.get("school"), "school 字段默认应该为 NULL");
            assertNull(result.get("student_id"), "student_id 字段默认应该为 NULL");
            
            System.out.println("✓ 新字段可以为 NULL 验证通过");
            
            // 清理测试数据
            jdbcTemplate.update("DELETE FROM users WHERE user_id = ?", userId);
            
        } catch (Exception e) {
            fail("测试新字段为 NULL 应该成功，但抛出异常: " + e.getMessage());
        }
    }
}
