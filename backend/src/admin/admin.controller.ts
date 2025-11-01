import { Controller, Get, Put, Delete, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@ApiTags('admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private activityLogsService: ActivityLogsService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.adminService.getAllUsers(pageNum, limitNum, search);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  async updateUser(@Param('id') id: string, @Body() data: any, @Request() req) {
    await this.activityLogsService.log({
      userId: req.user.userId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: id,
      details: JSON.stringify(data),
    });
    return this.adminService.updateUser(id, data);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async deleteUser(@Param('id') id: string, @Request() req) {
    await this.activityLogsService.log({
      userId: req.user.userId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: id,
    });
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user (Admin only)' })
  async suspendUser(@Param('id') id: string, @Request() req) {
    await this.activityLogsService.log({
      userId: req.user.userId,
      action: 'SUSPEND_USER',
      entityType: 'user',
      entityId: id,
    });
    return this.adminService.suspendUser(id);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  async activateUser(@Param('id') id: string, @Request() req) {
    await this.activityLogsService.log({
      userId: req.user.userId,
      action: 'ACTIVATE_USER',
      entityType: 'user',
      entityId: id,
    });
    return this.adminService.activateUser(id);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get platform insights (Admin only)' })
  async getInsights() {
    return this.adminService.getInsights();
  }

  @Get('activity-logs')
  @ApiOperation({ summary: 'Get activity logs (Admin only)' })
  async getActivityLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    return this.activityLogsService.getLogs(pageNum, limitNum);
  }
}
