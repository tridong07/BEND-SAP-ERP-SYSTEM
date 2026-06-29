import { Module, Global } from '@nestjs/common';
import { OracleService } from '../common/oracle.service';

@Global() // Biến nó thành module toàn cục, không cần import ở đâu cả
@Module({
  providers: [OracleService],
  exports: [OracleService],
})
export class DatabaseModule {}