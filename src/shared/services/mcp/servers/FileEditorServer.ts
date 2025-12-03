/**
 * File Editor MCP Server
 * 提供 AI 编辑工作区和笔记文件的能力
 * 
 * 已重构为模块化结构，详见 ./file-editor/ 目录
 * 此文件保留用于向后兼容
 */

// 从模块化版本重新导出
export { FileEditorServer } from './file-editor';
export * from './file-editor/types';
export * from './file-editor/constants';
