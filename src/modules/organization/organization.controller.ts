import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy toàn bộ cây tổ chức' })
  async getFullTree() {
    return await this.organizationService.getFullTree();
  }

  @Post('nodes')
  @ApiOperation({ summary: 'Tạo một node mới' })
  async createNode(@Body() dto: any) {
    // Gọi service với mode CREATE
    return await this.organizationService.createOrUpdateNode({ ...dto, mode: 'CREATE' });
  }

  @Put('nodes/:id') // Endpoint cho chỉnh sửa
  @ApiOperation({ summary: 'Cập nhật thông tin node' })
  async updateNode(@Param('id') id: string, @Body() dto: any) {
    // Gọi service với mode EDIT
    return await this.organizationService.createOrUpdateNode({ ...dto, mode: 'EDIT' });
  }

  @Delete('nodes/:id')
  @ApiOperation({ summary: 'Xóa đơn vị' })
  async deleteNode(
    @Param('id') id: string,
    @Query('level') level: number,
    @Query('fact_no') fact_no: string,
    @Query('dept_no') dept_no: string,
    @Query('cls_no') cls_no?: string,
    @Query('sec_no') sec_no?: string,
  ) {
    return await this.organizationService.deleteNode(Number(level), fact_no, dept_no, cls_no, sec_no);
  }
}