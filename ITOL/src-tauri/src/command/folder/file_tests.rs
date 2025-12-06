#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_basic_typescript_template() {
        let template = generate_basic_typescript_template("test.ts");
        
        assert!(template.contains("import fs from 'fs'"));
        assert!(template.contains("interface InputData"));
        assert!(template.contains("interface OutputData"));
        assert!(template.contains("async function main()"));
    }

    #[test]
    fn test_create_file_result_structure() {
        let result = CreateFileResult {
            file_path: "C:\\test\\file.ts".to_string(),
            file_name: "file".to_string(),
            file_extension: "ts".to_string(),
            template_applied: true,
        };

        assert_eq!(result.file_name, "file");
        assert_eq!(result.file_extension, "ts");
        assert!(result.template_applied);
    }
}
