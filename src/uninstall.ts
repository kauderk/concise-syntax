import { uninstall } from './extension'
uninstall().catch((e: unknown) => console.error(e))
